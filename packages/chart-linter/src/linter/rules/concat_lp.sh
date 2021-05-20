# usage: ./concat_lp.sh srcdir destdir

declare -a files=("define"
"hard"
"soft"
"output"
)

newline=$'\n\n'
output="// GENERATED WITH concat_lp.sh. DO NOT MODIFY.${newline}"

i=0
for file in "${files[@]}"
do
  path="${1}/${file}.lp"
  lp=$(cat $path | sed -e s/\`/\'/g)
  const=$(echo $file | tr a-z A-Z | tr \- _)
  if [ "$i" -ne 0 ]
  then
    output+="${newline}"
  fi
  output+="export const ${const} = \`${lp}${newline}\`;"
  let "i++"
done

echo "$output" > $2/index.ts